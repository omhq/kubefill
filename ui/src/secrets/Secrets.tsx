import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { fetchApplication, fetchApplicationSecrets } from "../requests/applications";
import { ApplicationFull, Secret as SecretType } from "../types";
import { Box, IconButton, Alert, styled, Container } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Crumbs } from "../Crumbs";
import { useNavigate, useParams } from "react-router-dom";
import { Visibility } from "@mui/icons-material";
import { getErrorMessage } from "../requests/utils";
import { useSnackbar } from "notistack";
import { Actions, LinkAction, WorkspaceNavBar } from "../components";

const DataGridContainer = styled(Container)`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const Secrets: FunctionComponent = (): ReactElement => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { appId } = useParams<{ appId: string }>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [secrets, setSecrets] = useState<SecretType[]>([]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", minWidth: 50 },
    { field: "name", headerName: "NAME", flex: 0.8, width: 100 },
    {
      field: "created",
      headerName: "CREATED ON",
      flex: 0.6,
      width: 200,
      valueGetter: (params) => {
        let result = [];
        if (params.row.created_at) {
          const date = new Date(params.row.created_at);
          result.push(date);
        } else {
          result = ["Unknown"];
        }
        return result.join(", ");
      },
    },
    {
      field: "updated",
      headerName: "UPDATED ON",
      flex: 0.6,
      width: 200,
      valueGetter: (params) => {
        let result = [];
        if (params.row.updated_at) {
          const date = new Date(params.row.updated_at);
          result.push(date);
        } else {
          result = ["Unknown"];
        }
        return result.join(", ");
      },
    },
    {
      field: "action",
      headerName: "",
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const onClick = (e: any) => {
          navigate(`/applications/${appId}/secrets/${params.row.id}`);
        };

        return (
          <Box>
            <IconButton
              onClick={onClick}
              size="small"
              color="default"
              aria-label="view"
              component="label"
            >
              <Visibility />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    let unsubscribed = false;

    if (appId) {
      fetchApplicationSecrets(appId)
        .then((data: any) => {
          if (!unsubscribed) {
            const sortedData = data.sort((a: { id: number }, b: { id: number }) => b.id - a.id);
            setSecrets(sortedData);
          }
        })
        .catch((err) => {
          err.json().then((resp: any) => {
            enqueueSnackbar(getErrorMessage(resp), {
              variant: "error",
            });
          });
        });

      fetchApplication(parseInt(appId))
        .then((data) => {
          setApplication(data);
        })
        .catch((err) => {
          err.json().then((resp: any) => {
            enqueueSnackbar(getErrorMessage(resp), {
              variant: "error",
            });
          });
        });
    }

    return () => {
      unsubscribed = true;
    };
  }, [appId]);

  if (!appId) {
    throw new Error("The specified app identifier is invalid.");
  }

  return (
    <>
      <WorkspaceNavBar>
        <Crumbs
          crumbs={
            application
              ? [
                  {
                    label: "apps",
                    path: "/applications",
                    current: false,
                  },
                  {
                    label: application.app.name,
                    path: `/applications/${application.app.id}`,
                    current: false,
                  },
                  {
                    label: "secrets",
                    path: `/applications/${application.app.id}/secrets`,
                    current: true,
                  },
                ]
              : []
          }
        />

        <Actions>
          <LinkAction to={`/applications/${appId}/secrets/new`}>New</LinkAction>
        </Actions>
      </WorkspaceNavBar>

      <DataGridContainer>
        {secrets.length > 0 && (
          <DataGrid
            autoHeight
            rows={secrets}
            columns={columns}
            pageSize={100}
            rowsPerPageOptions={[100]}
          />
        )}

        {secrets.length === 0 && (
          <Alert variant="outlined" severity="info">
            No secrets
          </Alert>
        )}
      </DataGridContainer>
    </>
  );
};

export default Secrets;
