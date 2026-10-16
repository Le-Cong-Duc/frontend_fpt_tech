---
name: fe-redux-api
description: >-
  Use this skill when integrating backend REST APIs, configuring Axios calls, managing
  Redux Toolkit state and slices, writing thunks, or handling token authentication in frontend_fpt_tech.
---

# Frontend Redux Toolkit & API Integration Skill

This skill provides best practices and templates for connecting REST endpoints (`/api/v1/...`) with Axios, Redux Toolkit, and Ant Design notifications in `frontend_fpt_tech`.

---

## 1. API Architecture Overview

```
[Component / UI Page]
        │
        ▼ (dispatch)
[Redux Async Thunk]
        │
        ▼ (calls)
[src/config/api.ts]
        │
        ▼ (uses instance)
[src/config/axios-customize.ts]  <─── Injects Bearer token from localStorage
        │                             Handles 401 token refresh with Mutex
        ▼ (HTTP)
[Backend NestJS / Express API]
```

---

## 2. Axios Customization (`src/config/axios-customize.ts`)

Key conventions:
1. `baseURL`: reads `import.meta.env.VITE_BACKEND_URL`.
2. Auth header: automatically attached via `Authorization: Bearer ${localStorage.getItem('access_token')}`.
3. Response interceptor: unwraps `res.data` directly.
4. Token Refresh: uses `async-mutex` to ensure multiple concurrent 401 requests wait for a single refresh call (`callRefreshToken()`).

---

## 3. Defining Typed API Calls (`src/config/api.ts`)

Always wrap responses in `IBackendRes<T>`:

```typescript
import axios from 'config/axios-customize';
import type { IBackendRes, IModelPaginate } from '@/types/backend';

const API_PREFIX = '/api/v1';

// 1. Generic helpers for CRUD
const list = <T>(resource: string, query = '') => 
    axios.get<IBackendRes<IModelPaginate<T>>>(`${API_PREFIX}/${resource}${query ? `?${query}` : ''}`);

const findById = <T>(resource: string, id: string) => 
    axios.get<IBackendRes<T>>(`${API_PREFIX}/${resource}/${id}`);

const create = <T>(resource: string, payload: any) => 
    axios.post<IBackendRes<T>>(`${API_PREFIX}/${resource}`, payload);

const update = <T>(resource: string, id: string, payload: any) => 
    axios.patch<IBackendRes<T>>(`${API_PREFIX}/${resource}/${id}`, { ...payload, _id: id });

const remove = <T>(resource: string, id: string) => 
    axios.delete<IBackendRes<T>>(`${API_PREFIX}/${resource}/${id}`);

// 2. Export specific entity functions
export const callFetchInvoices = (query = '') => list<IInvoice>('invoices', query);
export const callCreateInvoice = (payload: any) => create<IInvoice>('invoices', payload);
```

---

## 4. Query String Construction with `query-string`

The backend supports filtering, pagination, and sorting:
- **Pagination**: `current=1&pageSize=10`
- **Regex search**: `name=/searchTerm/i`
- **Sorting**: `sort=fieldName` (asc) or `sort=-fieldName` (desc)
- **Population**: `populate=teacher_id,course_id`

Example query builder helper:
```typescript
import queryString from 'query-string';

export const buildApiQuery = (params: { current?: number; pageSize?: number; name?: string; sort?: string }) => {
    const query: any = {
        current: params.current || 1,
        pageSize: params.pageSize || 10,
    };
    if (params.name) query.name = `/${params.name}/i`;
    if (params.sort) query.sort = params.sort;
    return queryString.stringify(query);
};
```

---

## 5. Redux Toolkit Slice Pattern

Standard state shape:
```typescript
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { callFetchData } from '@/config/api';

interface IState {
    isFetching: boolean;
    meta: {
        current: number;
        pageSize: number;
        pages: number;
        total: number;
    };
    result: any[];
}

export const fetchData = createAsyncThunk(
    'moduleName/fetchData',
    async ({ query }: { query: string }) => {
        const response = await callFetchData(query);
        return response;
    }
);

const initialState: IState = {
    isFetching: false,
    meta: { current: 1, pageSize: 10, pages: 0, total: 0 },
    result: []
};

export const slice = createSlice({
    name: 'moduleName',
    initialState,
    reducers: {
        resetState: (state) => {
            state.result = [];
            state.meta = { current: 1, pageSize: 10, pages: 0, total: 0 };
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchData.pending, (state) => {
                state.isFetching = true;
            })
            .addCase(fetchData.fulfilled, (state, action) => {
                state.isFetching = false;
                if (action.payload?.data) {
                    state.meta = action.payload.data.meta;
                    state.result = action.payload.data.result;
                }
            })
            .addCase(fetchData.rejected, (state) => {
                state.isFetching = false;
            });
    }
});

export const { resetState } = slice.actions;
export default slice.reducer;
```

---

## 6. Notification & Response Handling Pattern

Always follow this exact check pattern in UI components:

```tsx
const handleSubmit = async (values: any) => {
    const res = await callCreateItem(values);
    if (res && res.data) {
        message.success('Thực hiện thành công');
        // Close modal, refresh table, etc.
    } else {
        notification.error({
            message: 'Có lỗi xảy ra',
            description: Array.isArray(res.message) 
                ? res.message.join(', ') 
                : (res.message || 'Thao tác không thành công')
        });
    }
};
```

