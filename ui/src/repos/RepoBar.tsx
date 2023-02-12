import Typography from "@mui/material/Typography";
import { Box, CircularProgress, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LoadingButton from "@mui/lab/LoadingButton";

function RepoBar({
  loading,
  deleting,
  updating,
  formValid,
  sync,
  del,
  update,
}: {
  loading: boolean;
  deleting: boolean;
  updating: boolean;
  formValid: boolean;
  sync: () => void;
  del: () => void;
  update: () => void;
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
            loading={loading}
            onClick={sync}
            variant="outlined"
            color="inherit"
            sx={{ ml: 1, mr: 1 }}
          >
            Sync
          </LoadingButton>
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
export default RepoBar;
