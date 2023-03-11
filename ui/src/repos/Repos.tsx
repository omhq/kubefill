import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { fetchRepos } from "../requests/repos";
import { Repo as RepoType } from "../types";
import { Box, IconButton, Alert, styled, Container, CircularProgress } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Crumbs } from "../Crumbs";
import { useNavigate } from "react-router-dom";
import { Visibility } from "@mui/icons-material";
import { getErrorMessage } from "../requests/utils";
import { useSnackbar } from "notistack";
import { LinkAction, WorkspaceNavBar } from "../components";

const DataGridContainer = styled(Container)`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const CircularProgressContainer = styled(Container)`
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: calc(100vh - 56px - 56px - 24px);
`;

export const Repos: FunctionComponent = (): ReactElement => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [repos, setRepos] = useState<RepoType[]>([]);
  let [loading, setLoading] = useState<boolean>(true);
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", minWidth: 50 },
    { field: "url", headerName: "URL", flex: 0.8, width: 100 },
    { field: "branch", headerName: "BRANCH", flex: 0.8, width: 100 },
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
          navigate(`/repos/${params.row.id}`);
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

    setLoading(true);
    fetchRepos()
      .then((data: any) => {
        if (!unsubscribed) {
          const sortedData = data.sort((a: { id: number }, b: { id: number }) => b.id - a.id);
          setRepos(sortedData);
        }
      })
      .catch((err) => {
        err.json().then((resp: any) => {
          enqueueSnackbar(getErrorMessage(resp), {
            variant: "error",
          });
        });
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      unsubscribed = true;
    };
  }, []);

  return (
    <>
      <WorkspaceNavBar>
        <div></div>
        <LinkAction to="/repos/new">New</LinkAction>
      </WorkspaceNavBar>

      {!loading && (
        <>
          {repos.length > 0 && (
            <DataGridContainer>
              <DataGrid
                autoHeight
                rows={repos}
                columns={columns}
                pageSize={100}
                rowsPerPageOptions={[100]}
              />
            </DataGridContainer>
          )}

          {repos.length === 0 && (
            <Alert variant="outlined" severity="info">
              No repos yet
            </Alert>
          )}
        </>
      )}

      {loading && (
        <CircularProgressContainer>
          <CircularProgress size={22} />
        </CircularProgressContainer>
      )}
    </>
  );
};

export default Repos;
