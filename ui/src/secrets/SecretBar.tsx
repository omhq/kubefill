import Typography from "@mui/material/Typography";
import { Box, CircularProgress, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LoadingButton from "@mui/lab/LoadingButton";

function SecretBar({
  deleting,
  updating,
  formValid,
  del,
  update,
}: {
  deleting: boolean;
  updating: boolean;
  formValid: boolean;
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

export default SecretBar;
