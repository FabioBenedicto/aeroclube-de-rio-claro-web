# Design: Histórico de Remessas e Retornos CNAB

**Data:** 2026-06-02  
**Contexto:** Redesenho da aba CNAB para exibir histórico persistido de remessas e retornos, com modal de seleção de faturas ao gerar remessa.

---

## 1. Modelos de dados (API)

```prisma
model CnabRemessa {
  id              Int      @id @default(autoincrement())
  created_at      DateTime @default(now())
  sequence_number Int
  bill_ids        Json
  bill_count      Int
  total_amount    Decimal  @db.Decimal(12, 2)
  file_path       String   @db.VarChar(200)

  @@map("cnab_remessas")
}

model CnabRetorno {
  id             Int      @id @default(autoincrement())
  processed_at   DateTime @default(now())
  paid_ids       Json
  rejected_ids   Json
  errors         Json
  paid_count     Int
  rejected_count Int

  @@map("cnab_retornos")
}
```

Arquivo `.rem` salvo em: `uploads/cnab/remessa_{YYYYMMDD}_{sequence}.rem`  
Diretório criado automaticamente se não existir.

---

## 2. Endpoints da API

### Novos endpoints

#### `GET /cnab/remessas`
- Query params: `page` (default 1), `limit` (default 20)
- Retorna: `PaginatedResponse<CnabRemessa>`
- Ordenação: `created_at DESC`

#### `GET /cnab/remessas/:id/download`
- Faz streaming do arquivo `.rem` armazenado em `file_path`
- `Content-Disposition: attachment; filename="remessa_{YYYYMMDD}_{seq}.rem"`
- 404 se registro ou arquivo não encontrado

#### `GET /cnab/retornos`
- Query params: `page` (default 1), `limit` (default 20)
- Retorna: `PaginatedResponse<CnabRetorno>`
- Ordenação: `processed_at DESC`

### Endpoints modificados

#### `POST /cnab/remessa` ← breaking change
**Antes:** retornava o arquivo binário (stream)  
**Depois:** salva o arquivo em disco, persiste `CnabRemessa`, retorna JSON:
```json
{ "id": 1, "sequence_number": 1, "bill_count": 3, "total_amount": "450.00", "created_at": "..." }
```
O download é feito separadamente via `GET /cnab/remessas/:id/download`.

#### `POST /cnab/retorno` ← adição
Além do comportamento atual, persiste `CnabRetorno` no banco.  
Retorna o resultado existente acrescido de `retorno_id`.

---

## 3. Camadas de implementação (API)

### `CnabRepository` — novos métodos
- `saveRemessa(data)` — cria `CnabRemessa`
- `listRemessas(page, limit)` — lista paginada
- `findRemessa(id)` — busca por id (para download)
- `saveRetorno(data)` — cria `CnabRetorno`
- `listRetornos(page, limit)` — lista paginada

### `CnabService` — alterações
- `generateRemessa(dto)`:
  1. Gera buffer CNAB (comportamento existente)
  2. Salva arquivo em `uploads/cnab/remessa_{YYYYMMDD}_{seq}.rem`
  3. Chama `saveRemessa` com metadados
  4. Retorna objeto `CnabRemessa` criado (não mais o buffer)

- `downloadRemessa(id)`:
  1. Busca `CnabRemessa` por id
  2. Lê o arquivo do disco
  3. Retorna buffer + nome do arquivo

- `processRetorno(buffer)`:
  1. Processa o arquivo (comportamento existente)
  2. Chama `saveRetorno` com resultado
  3. Retorna resultado + `retorno_id`

### `CnabController` — alterações
- `POST /cnab/remessa` — remove `@Res()` e stream, retorna JSON do service
- `GET /cnab/remessas` — novo endpoint paginado
- `GET /cnab/remessas/:id/download` — usa `@Res()` para stream do arquivo
- `GET /cnab/retornos` — novo endpoint paginado

---

## 4. Frontend

### Novos tipos em `src/types/index.ts`

```typescript
export interface CnabRemessa {
  id: number;
  created_at: string;
  sequence_number: number;
  bill_count: number;
  total_amount: number;
  file_path: string;
}

export interface CnabRetorno {
  id: number;
  processed_at: string;
  paid_count: number;
  rejected_count: number;
  paid_ids: number[];
  rejected_ids: number[];
  errors: string[];
}
```

### Novos endpoints em `src/api/cnab.ts`

```typescript
export const getRemessas = (page = 1, limit = 20) =>
  client.get<PaginatedResponse<CnabRemessa>>('/cnab/remessas', { params: { page, limit } }).then(r => r.data);

export const downloadRemessa = (id: number) =>
  client.get<Blob>(`/cnab/remessas/${id}/download`, { responseType: 'blob' }).then(r => r.data);

export const getRetornos = (page = 1, limit = 20) =>
  client.get<PaginatedResponse<CnabRetorno>>('/cnab/retornos', { params: { page, limit } }).then(r => r.data);
```

`generateRemessa` alterado para retornar `CnabRemessa` (JSON) em vez de `Blob`.

### Redesenho de `src/pages/cnab/Cnab.tsx`

#### Layout geral
Duas seções verticais na página:
1. **Remessas** — tabela com header "Remessas CNAB" + botão "Gerar Remessa" à direita
2. **Retornos** — tabela com header "Retornos" + botão "Importar Retorno" à direita

#### Tabela de Remessas
Colunas: `Data | Sequência | Faturas | Total | (botão download)`
- Data: `formatDate(created_at)` 
- Sequência: `#1`, `#2`, etc.
- Faturas: número inteiro
- Total: `R$ {formatBRL(total_amount)}`
- Botão download por linha: ícone `Download`, chama `downloadRemessa(id)` e dispara download no browser

#### Tabela de Retornos
Colunas: `Data | Liquidadas | Rejeitadas | Erros`
- Liquidadas/Rejeitadas: número inteiro com badge colorido (`success`/`danger`)
- Erros: número ou botão "ver erros" que expande lista inline quando > 0

#### Modal "Gerar Remessa"
Aberto pelo botão "Gerar Remessa" no header da seção Remessas.  
Conteúdo: tabela de faturas `status = 'open'` com:
- Filtro de vencimento (de/até) + botão Aplicar
- Checkboxes de seleção
- Barra de seleção com total quando houver selecionadas
- Botão "Gerar" — chama `POST /cnab/remessa` (retorna JSON), dispara download via `GET /cnab/remessas/:id/download`, fecha modal, invalida query de remessas

#### Estado de loading e vazio
- Cada tabela tem estado de loading independente
- "Nenhuma remessa gerada ainda" / "Nenhum retorno importado ainda"

---

## 5. Tratamento de erros

- Download: se arquivo não existe no disco → 404 com mensagem
- Geração: se erro ao salvar arquivo → rollback (não persiste no banco)
- Retorno: erros de parsing já exibidos na tabela
