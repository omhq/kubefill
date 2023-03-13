import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { fetchApplications } from "../requests/applications";
import { Application as ApplicationType } from "../types";
import { Box, IconButton, Alert, Container, styled, CircularProgress } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { Visibility } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { LinkAction, WorkspaceNavBar } from "../components";

const CircularProgressContainer = styled(Container)`
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: calc(100vh - 56px - 56px - 24px);
`;

const Applications: FunctionComponent = (): ReactElement => {
  const navigate = useNavigate();
  let [loading, setLoading] = useState<boolean>(true);
  const [applications, setApplications] = useState<ApplicationType[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", minWidth: 50 },
    { field: "name", headerName: "NAME", flex: 0.2, width: 100 },
    { field: "repo_id", headerName: "REPO", flex: 0.2, width: 100 },
    { field: "manifest_path", headerName: "MANIFEST PATH", flex: 0.2, width: 100 },
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
          navigate(`/applications/${params.row.id}`);
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
    fetchApplications()
      .then((data) => {
        if (!unsubscribed) {
          const sortedData = data.sort((a, b) => b.id - a.id);
          setApplications(sortedData);
          setLoading(false);
        }
      })
      .catch((err) => {
        err.json().then((resp: any) => {
          enqueueSnackbar(getErrorMessage(resp), {
            variant: "error",
          });
        });
      });

    return () => {
      unsubscribed = true;
    };
  }, [enqueueSnackbar]);

  return (
    <>
      <WorkspaceNavBar>
        <div></div>
        <LinkAction to="/applications/new">New</LinkAction>
      </WorkspaceNavBar>

      {!loading && (
        <Container sx={{ mt: 2 }}>
          {applications.length > 0 && (
            <DataGrid
              autoHeight={true}
              rows={applications}
              columns={columns}
              pageSize={100}
              rowsPerPageOptions={[100]}
            />
          )}

          {applications.length === 0 && (
            <Alert variant="outlined" severity="info">
              No applications yet
            </Alert>
          )}
        </Container>
      )}

      {loading && (
        <CircularProgressContainer>
          <CircularProgress size={22} />
        </CircularProgressContainer>
      )}
    </>
  );
};

export default Applications;
