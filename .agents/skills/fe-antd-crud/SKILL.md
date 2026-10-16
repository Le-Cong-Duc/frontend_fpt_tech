---
name: fe-antd-crud
description: >-
  Use this skill when developing, refactoring, or extending CRUD pages, tables, forms,
  modals, or view drawers in frontend_fpt_tech using React 18, TypeScript, Ant Design v5,
  and ProComponents.
---

# FE Ant Design CRUD Development Skill

This skill defines the standardized end-to-end procedure for building CRUD features in `frontend_fpt_tech`.

---

## Architecture Checklist for New CRUD Module

When creating or modifying a CRUD entity (e.g. `course`, `classroom`, `enrollment`, `voucher`), execute the following steps in order:

1. **Type Definitions**: Add interface to `src/types/backend.d.ts`
2. **API Functions**: Add endpoints to `src/config/api.ts`
3. **Permissions**: Define permission constants in `src/config/permissions.ts`
4. **Redux Slice**: Create `src/redux/slice/<entity>Slide.ts` and register in `src/redux/store.ts`
5. **Form Modal**: Create `src/components/admin/<entity>/modal.<entity>.tsx`
6. **View Detail Drawer**: Create `src/components/admin/<entity>/view.<entity>.tsx`
7. **Main Page**: Create `src/pages/admin/<entity>.tsx` using `DataTable` / `ProTable`
8. **Routing**: Register route in `src/App.tsx`
9. **Access Control**: Wrap buttons and actions in `<Access />`

---

## Detailed Step-by-Step Guide

### Step 1: Type Definitions (`src/types/backend.d.ts`)

Define the entity interface:
```typescript
export interface IYourEntity {
    _id?: string;
    name: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}
```

### Step 2: API Endpoints (`src/config/api.ts`)

Use the generic helper functions or axios directly:
```typescript
export const callCreateYourEntity = (value: Omit<IYourEntity, '_id'>) =>
    create<IYourEntity>('your-entities', value);

export const callUpdateYourEntity = (value: Partial<IYourEntity>, id: string) =>
    update<IYourEntity>('your-entities', id, value);

export const callDeleteYourEntity = (id: string) =>
    remove<IYourEntity>('your-entities', id);

export const callFetchYourEntity = (query = '') =>
    list<IYourEntity>('your-entities', query);

export const callFetchYourEntityById = (id: string) =>
    findById<IYourEntity>('your-entities', id);
```

### Step 3: Permissions (`src/config/permissions.ts`)

Add to `ALL_PERMISSIONS` and `ALL_MODULES`:
```typescript
export const ALL_PERMISSIONS = {
    // ...
    YOUR_ENTITIES: resourcePermissions('your-entities', 'YOUR_ENTITIES'),
};

export const ALL_MODULES = {
    // ...
    YOUR_ENTITIES: 'YOUR_ENTITIES',
};
```

### Step 4: Redux Toolkit Slice (`src/redux/slice/<entity>Slide.ts`)

Standard pagination slice pattern:
```typescript
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchYourEntity } from '@/config/api';
import { IYourEntity } from '@/types/backend';

interface IState {
    isFetching: boolean;
    meta: {
        current: number;
        pageSize: number;
        pages: number;
        total: number;
    };
    result: IYourEntity[];
}

export const fetchYourEntity = createAsyncThunk(
    'yourEntity/fetchYourEntity',
    async ({ query }: { query: string }) => {
        const response = await callFetchYourEntity(query);
        return response;
    }
);

const initialState: IState = {
    isFetching: true,
    meta: { current: 1, pageSize: 10, pages: 0, total: 0 },
    result: []
};

export const yourEntitySlice = createSlice({
    name: 'yourEntity',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchYourEntity.pending, (state) => {
            state.isFetching = true;
        });
        builder.addCase(fetchYourEntity.fulfilled, (state, action) => {
            state.isFetching = false;
            if (action.payload?.data) {
                state.meta = action.payload.data.meta;
                state.result = action.payload.data.result;
            }
        });
        builder.addCase(fetchYourEntity.rejected, (state) => {
            state.isFetching = false;
        });
    }
});

export default yourEntitySlice.reducer;
```
Register the reducer in `src/redux/store.ts`.

### Step 5: Form Modal (`src/components/admin/<entity>/modal.<entity>.tsx`)

Support both Create and Update:
```tsx
import { useEffect, useState } from 'react';
import { Form, Input, Modal, message, notification } from 'antd';
import { IYourEntity } from '@/types/backend';
import { callCreateYourEntity, callUpdateYourEntity } from '@/config/api';

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IYourEntity | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalYourEntity = (props: IProps) => {
    const { openModal, setOpenModal, dataInit, setDataInit, reloadTable } = props;
    const [isSubmit, setIsSubmit] = useState<boolean>(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (dataInit?._id) {
            form.setFieldsValue(dataInit);
        } else {
            form.resetFields();
        }
    }, [dataInit]);

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    const onFinish = async (values: any) => {
        setIsSubmit(true);
        if (dataInit?._id) {
            // Update
            const res = await callUpdateYourEntity(values, dataInit._id);
            if (res.data) {
                message.success('Cập nhật thành công');
                handleReset();
                reloadTable();
            } else {
                notification.error({ message: 'Có lỗi xảy ra', description: res.message });
            }
        } else {
            // Create
            const res = await callCreateYourEntity(values);
            if (res.data) {
                message.success('Tạo mới thành công');
                handleReset();
                reloadTable();
            } else {
                notification.error({ message: 'Có lỗi xảy ra', description: res.message });
            }
        }
        setIsSubmit(false);
    };

    return (
        <Modal
            title={dataInit?._id ? 'Cập nhật' : 'Thêm mới'}
            open={openModal}
            onOk={() => form.submit()}
            onCancel={handleReset}
            okText={dataInit?._id ? 'Cập nhật' : 'Tạo mới'}
            cancelText="Hủy"
            confirmLoading={isSubmit}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="name"
                    label="Tên"
                    rules={[{ required: true, message: 'Vui lòng không để trống!' }]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalYourEntity;
```

### Step 6: Main Page (`src/pages/admin/<entity>.tsx`)

Use `DataTable` with `ProColumns`:
```tsx
import DataTable from "@/components/client/data-table";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchYourEntity } from "@/redux/slice/yourEntitySlide";
import { IYourEntity } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, message, notification } from "antd";
import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import { callDeleteYourEntity } from "@/config/api";
import queryString from 'query-string';
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import ModalYourEntity from "@/components/admin/yourEntity/modal.yourEntity";
import ViewDetailYourEntity from "@/components/admin/yourEntity/view.yourEntity";

const YourEntityPage = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [dataInit, setDataInit] = useState<IYourEntity | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);

    const tableRef = useRef<ActionType>();
    const isFetching = useAppSelector(state => state.yourEntity.isFetching);
    const meta = useAppSelector(state => state.yourEntity.meta);
    const entities = useAppSelector(state => state.yourEntity.result);
    const dispatch = useAppDispatch();

    const reloadTable = () => tableRef?.current?.reload();

    const handleDelete = async (id?: string) => {
        if (!id) return;
        const res = await callDeleteYourEntity(id);
        if (res.data) {
            message.success('Xóa thành công');
            reloadTable();
        } else {
            notification.error({ message: 'Có lỗi xảy ra', description: res.message });
        }
    };

    const columns: ProColumns<IYourEntity>[] = [
        {
            title: 'Tên',
            dataIndex: 'name',
            sorter: true,
        },
        {
            title: 'Actions',
            render: (_value, entity) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.YOUR_ENTITIES.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ color: '#ffa940', cursor: 'pointer' }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>
                    <Access permission={ALL_PERMISSIONS.YOUR_ENTITIES.DELETE} hideChildren>
                        <Popconfirm
                            title="Xác nhận xóa?"
                            onConfirm={() => handleDelete(entity._id)}
                            okText="Xóa"
                            cancelText="Hủy"
                        >
                            <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                        </Popconfirm>
                    </Access>
                </Space>
            )
        }
    ];

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            current: params.current,
            pageSize: params.pageSize,
        };
        if (params.name) q.name = `/${params.name}/i`;
        // Handle sorting
        let sortBy = '';
        if (sort?.name) sortBy = sort.name === 'ascend' ? 'name' : '-name';
        if (sortBy) q.sort = sortBy;
        return queryString.stringify(q);
    };

    return (
        <div>
            <Access permission={ALL_PERMISSIONS.YOUR_ENTITIES.GET_PAGINATE}>
                <DataTable<IYourEntity>
                    actionRef={tableRef}
                    headerTitle="Danh sách"
                    rowKey="_id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={entities}
                    request={async (params, sort) => {
                        const query = buildQuery(params, sort);
                        dispatch(fetchYourEntity({ query }));
                    }}
                    pagination={{
                        current: meta.current,
                        pageSize: meta.pageSize,
                        showSizeChanger: true,
                        total: meta.total,
                        showTotal: (total, range) => (
                            <div>{range[0]}-{range[1]} trên {total} rows</div>
                        )
                    }}
                    toolBarRender={() => [
                        <Access permission={ALL_PERMISSIONS.YOUR_ENTITIES.CREATE} hideChildren key="create">
                            <Button
                                icon={<PlusOutlined />}
                                type="primary"
                                onClick={() => setOpenModal(true)}
                            >
                                Thêm mới
                            </Button>
                        </Access>
                    ]}
                />
            </Access>
            <ModalYourEntity
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={reloadTable}
            />
            <ViewDetailYourEntity
                open={openViewDetail}
                onClose={() => setOpenViewDetail(false)}
                dataInit={dataInit}
            />
        </div>
    );
};

export default YourEntityPage;
```

