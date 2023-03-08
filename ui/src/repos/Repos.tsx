import { useEffect, useState } from "react";
import { fetchRepos } from "../requests/repos";
import { Repo as RepoType } from "../types";
import { Box, IconButton, Alert } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ICrumb, Crumbs } from "../Crumbs";
import ReposBar from "./ReposBar";
import { useNavigate } from "react-router-dom";
import { Visibility } from "@mui/icons-material";
import Drawer from "../globals/Drawer";
import { getErrorMessage } from "../requests/utils";
import { useSnackbar } from "notistack";

const Repos = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [repos, setRepos] = useState<RepoType[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [crumbs, setCrumbs] = useState<ICrumb[]>([]);
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

    setCrumbs([
      {
        label: "repos",
        path: "/",
        current: true,
      },
    ]);

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
      <Drawer
        child={<ReposBar />}
        body={
          <>
            <Crumbs crumbs={crumbs} />

            {repos && repos.length ? (
              <>
                <div style={{ flexGrow: 1 }}>
                  <DataGrid
                    autoHeight
                    rows={repos}
                    columns={columns}
                    pageSize={100}
                    rowsPerPageOptions={[100]}
                  />
                </div>

                {!repos.length && <>no apps</>}
              </>
            ) : (
              <Alert variant="outlined" severity="info">
                No repos yet.
              </Alert>
            )}
          </>
        }
      />
    </>
  );
};

export default Repos;
