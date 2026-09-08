import { useEffect, useState } from 'react';
import { Result } from "antd";
import { useAppSelector } from '@/redux/hooks';
interface IProps {
    hideChildren?: boolean;
    children: React.ReactNode;
    permission: { method: string, path: string, module: string };
}

const Access = (props: IProps) => {
    //set default: hideChildren = false => vẫn render children
    // hideChildren = true => ko render children, ví dụ hide button (button này check quyền)
    const { permission, hideChildren = false } = props;
    const [allow, setAllow] = useState<boolean>(true);

    const permissions = useAppSelector(state => state.account.user.permissions);

    useEffect(() => {
        const check = permissions.find(item =>
            item.path === permission.path
            && item.method === permission.method
            && item.module === permission.module
        );
        setAllow(Boolean(check));
    }, [permissions, permission])

    return (
        <>
            {allow === true ?
                <>{props.children}</>
                :
                <>
                    {hideChildren === false ?
                        <Result
                            status="403"
                            title="Truy cập bị từ chối"
                            subTitle="Xin lỗi, bạn không có quyền hạn (permission) truy cập thông tin này"
                        />
                        :
                        <>
                            {/* render nothing */}
                        </>
                    }
                </>
            }
        </>

    )
}

export default Access;