import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { fetchApplications } from "../requests/applications";
import { Application as ApplicationType } from "../types";
import { Box, IconButton, Alert, Link, Icon, Button, styled } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Crumbs } from "../Crumbs";
import { useNavigate } from "react-router-dom";
import { Visibility } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { WorkspaceNavBar } from "../components";

const Action = styled(Button)`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
`;

const DataGridContainer = styled("div")`
  padding: ${({ theme }) => theme.spacing(4)};
`;

const Applications: FunctionComponent = (): ReactElement => {
  const navigate = useNavigate();
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

    fetchApplications()
      .then((data) => {
        if (!unsubscribed) {
          const sortedData = data.sort((a, b) => b.id - a.id);
          setApplications(sortedData);
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
  }, []);
  return (
    <>
      <WorkspaceNavBar>
        <Crumbs
          crumbs={[
            {
              label: "applications",
              path: "/",
              current: true,
            },
          ]}
        />

        <Link underline="none" color="inherit" href="/applications/new">
          <Action variant="outlined" size="small" disableElevation={true}>
            New
          </Action>
        </Link>
      </WorkspaceNavBar>

      {applications.length > 0 && (
        <DataGridContainer>
          <DataGrid
            autoHeight={true}
            rows={applications}
            columns={columns}
            pageSize={100}
            rowsPerPageOptions={[100]}
          />
        </DataGridContainer>
      )}
      {applications.length === 0 && (
        <Alert variant="outlined" severity="info">
          No applications yet
        </Alert>
      )}
    </>
  );
};

export default Applications;
