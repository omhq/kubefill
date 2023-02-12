import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";
import { LoadingButton } from "@mui/lab";

function RepoCreateBar({
  loading,
  formValid,
  create,
}: {
  loading: boolean;
  formValid: boolean;
  create: () => void;
}) {
  return (
    <AppBar position="fixed">
      <Toolbar>
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
            <LoadingButton
              disabled={!formValid}
              loading={loading}
              onClick={create}
              variant="outlined"
              color="inherit"
              sx={{ ml: 1, mr: 1 }}
            >
              Create
            </LoadingButton>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
export default RepoCreateBar;
