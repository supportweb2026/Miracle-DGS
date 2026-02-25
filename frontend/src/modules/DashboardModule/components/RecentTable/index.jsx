import { Dropdown, Table } from 'antd';

import { request } from '@/request';
import useFetch from '@/hooks/useFetch';

import { EllipsisOutlined, EyeOutlined, EditOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import useLanguage from '@/locale/useLanguage';
import { useNavigate } from 'react-router-dom';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { Tag } from 'antd';

export default function RecentTable({ ...props }) {
  const translate = useLanguage();
  let { entity, dataTableColumns } = props;
//tz
console.log('DataTable Columns:', dataTableColumns);

//tz

  //tz
  const items = [
    {
      label: translate('Show'),
      key: 'read',
      icon: <EyeOutlined />,
    },
    {
      label: translate('Edit'),
      key: 'edit',
      icon: <EditOutlined />,
    },
    {
      label: translate('Download'),
      key: 'download',
      icon: <FilePdfOutlined />,
    },
  ];

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRead = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/${entity}/read/${record._id}`);
  };
  const handleEdit = (record) => {
    dispatch(erp.currentAction({ actionType: 'update', data: record }));
    navigate(`/${entity}/update/${record._id}`);
  };
  const handleDownload = (record) => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record._id}.pdf`, '_blank');
  };
  /*dataTableColumns = dataTableColumns.map((col) => {
    if (col.dataIndex === 'status') {
      return {
        ...col,
        render: (status) => {
          switch (status) {
            case 'draft':
              return 'Brouillon';  
            case 'pending':
              return 'En Attente';  
            case 'sent':
              return 'Envoyé';  
              case 'accepted':
                return 'Accepté';
                case 'declined':
                return 'Refusé';
            default:
              return status;  
          }
        },
      };
    }
    return col;  
  })*/

    dataTableColumns = dataTableColumns.map((col) => {
      if (col.dataIndex === 'status') {
        return {
          ...col,
          render: (status) => {
            let color = '';
            let text = '';
    
            switch (status) {
              case 'draft':
                color = 'default';
                text = 'Brouillon';
                break;
              case 'pending':
                color = 'orange';
                text = 'En Attente';
                break;
              case 'sent':
                color = 'blue';
                text = 'Envoyé';
                break;
              case 'accepted':
                color = 'green';
                text = 'Accepté';
                break;
              case 'declined':
                color = 'red';
                text = 'Refusé';
                break;
              default:
                color = 'gray';
                text = status;
            }
    //{console.log('color dash=stauts', text,color)};
            return <Tag color={color}>{text}</Tag>;
          },
        };
      }
      return col;
    });
    //     style={{ border: `1px solid ${color}`, backgroundColor: 'transparent' }}

    

  dataTableColumns = [
    ...dataTableColumns,
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Dropdown
          menu={{
            items,
            onClick: ({ key }) => {
              switch (key) {
                case 'read':
                  handleRead(record);
                  break;
                case 'edit':
                  handleEdit(record);
                  break;
                case 'download':
                  handleDownload(record);
                  break;

                default:
                  break;
              }
            },
          }}
          trigger={['click']}
        >
          <EllipsisOutlined
            style={{ cursor: 'pointer', fontSize: '24px' }}
            onClick={(e) => e.preventDefault()}
          />
        </Dropdown>
      ),
    },
  ];

  const asyncList = () => {
    return request.list({ entity });
  };
  const { result, isLoading, isSuccess } = useFetch(asyncList);
  console.log('Résultat de la requête:', result);
console.log('Statut de la requête :', { isLoading, isSuccess });
  const firstFiveItems = () => {
    if (isSuccess && result) return result.slice(0, 5);
    return [];
  };

  return (
    <Table
      columns={dataTableColumns}
      rowKey={(item) => item._id}
      dataSource={isSuccess && firstFiveItems()}
      pagination={false}
      loading={isLoading}
      scroll={{ x: true }}
    />
  );
}
