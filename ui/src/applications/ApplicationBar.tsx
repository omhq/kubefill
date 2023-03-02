import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import CircularProgress from "@mui/material/CircularProgress";

function ApplicationBar({
  appId,
  updating,
  deleting,
  formValid,
  update,
  del,
}: {
  appId: string;
  updating: boolean;
  deleting: boolean;
  formValid: boolean;
  update: () => void;
  del: () => void;
}) {
  return (
    <>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}></Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          p: 1,
          m: 1,
          borderRadius: 1,
          alignItems: "center",
        }}
      >
        <Link
          sx={{ ml: 1, mr: 1 }}
          underline="none"
          color="inherit"
          href={`/applications/${appId}/secrets`}
        >
          Secrets
        </Link>

        <Link
          sx={{ ml: 1, mr: 1 }}
          underline="none"
          color="inherit"
          href={`/applications/${appId}/runs`}
        >
          Runs
        </Link>

        <Link
          sx={{ ml: 1, mr: 1 }}
          underline="none"
          color="inherit"
          href={`/applications/${appId}/run`}
        >
          Run
        </Link>

        <Box>
          <IconButton disabled={deleting} aria-label="delete" sx={{ p: 1 }} onClick={del}>
            {deleting ? (
              <CircularProgress size={20} sx={{ color: "inherit" }} />
            ) : (
              <DeleteIcon sx={{ color: "#fff", fontSize: 20 }} />
            )}
          </IconButton>
        </Box>

        <Box>
          <LoadingButton
            disabled={!formValid}
            loading={!!updating}
            onClick={update}
            variant="outlined"
            color="inherit"
            sx={{ ml: 1, mr: 1 }}
          >
            Update
          </LoadingButton>
        </Box>
      </Box>
    </>
  );
}

export default ApplicationBar;
