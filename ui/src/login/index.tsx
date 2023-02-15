import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { login } from "../requests/auth";
import { LOCAL_STORAGE } from "../constants";
import { authLoginSuccess } from "../reducers";
import { getErrorMessage } from "../requests/utils";
import { useSnackbar } from "notistack";
import {
  Box,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

interface IProfileProps {
  dispatch: any;
}

const Login = (props: IProfileProps) => {
  const { dispatch } = props;
  const [loggingIn, setLoggingIn] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: () => {},
  });

  const handleLogin = () => {
    if (formValid) {
      const username = formik.values.username;
      const password = formik.values.password;

      if (username && password) {
        setLoggingIn(true);

        login(username, password)
          .then((data: { token: string }) => {
            localStorage.setItem(
              LOCAL_STORAGE,
              JSON.stringify({
                token: data.token,
              })
            );
            dispatch(authLoginSuccess(data));
            navigate("/");
          })
          .catch((err: any) => {
            err.json().then((resp: any) => {
              enqueueSnackbar(getErrorMessage(resp), {
                variant: "error",
              });
            });
          })
          .finally(() => {
            setLoggingIn(false);
          });
      }
    }
  };

  useEffect(() => {
    if (Object.keys(formik.errors).length) {
      setFormValid(false);
    } else {
      setFormValid(true);
    }
  }, [formik.errors, formValid]);

  return (
    <Container sx={{ mt: 4, mb: 2, p: 0 }} maxWidth="sm">
      <Box component="form" noValidate autoComplete="off">
        <FormControl
          error={!!formik.touched?.username && !!formik.errors?.username}
          fullWidth
          sx={{ mb: 2 }}
        >
          <InputLabel htmlFor="username">username</InputLabel>
          <OutlinedInput
            required
            error={!!formik.touched?.username && !!formik.errors?.username}
            id="username"
            name="username"
            label="Username"
            value={formik.values?.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />

          {formik.touched?.username && formik.errors?.username && (
            <FormHelperText id="username-error-text">
              <>{formik.errors?.username}</>
            </FormHelperText>
          )}
        </FormControl>

        <FormControl
          error={!!formik.touched?.password && !!formik.errors?.password}
          fullWidth
          sx={{ mb: 2 }}
        >
          <InputLabel htmlFor="password">password</InputLabel>
          <OutlinedInput
            required
            error={!!formik.touched?.password && !!formik.errors?.password}
            id="password"
            name="password"
            label="password"
            type="password"
            value={formik.values?.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />

          {formik.touched?.password && formik.errors?.password && (
            <FormHelperText id="password-error-text">
              <>{formik.errors?.password}</>
            </FormHelperText>
          )}
        </FormControl>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <Box>
            <LoadingButton
              disabled={!formValid}
              loading={!!loggingIn}
              onClick={handleLogin}
              variant="outlined"
              color="primary"
            >
              Login
            </LoadingButton>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
