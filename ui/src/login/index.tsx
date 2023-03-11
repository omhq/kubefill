import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { login } from "../requests/auth";
import { LOCAL_STORAGE } from "../constants";
import { authLoginSuccess } from "../reducers";
import { getErrorMessage } from "../requests/utils";
import { useSnackbar } from "notistack";
import { Container, FormHelperText, styled } from "@mui/material";

import { LoadingAction, TextField } from "../components";

const Root = styled(Container)`
  display: flex;
  flex-direction: column;
  row-gap: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledForm = styled("form")`
  display: flex;
  flex-direction: column;
  row-gap: ${({ theme }) => theme.spacing(2)};
`;

const ActionsContainer = styled("div")`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

export interface ILoginProps {
  dispatch: any;
}

const Login: FunctionComponent<ILoginProps> = (props: ILoginProps): ReactElement => {
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
    <Root>
      <StyledForm noValidate={true} autoComplete="off">
        <TextField
          required={true}
          error={!!formik.touched?.username && !!formik.errors?.username}
          id="username"
          name="username"
          label="Username"
          value={formik.values?.username}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          fullWidth={true}
        />
        {formik.touched?.username && formik.errors?.username && (
          <FormHelperText id="username-error-text">{formik.errors?.username}</FormHelperText>
        )}

        <TextField
          required={true}
          error={!!formik.touched?.password && !!formik.errors?.password}
          fullWidth={true}
          id="password"
          name="password"
          label="password"
          type="password"
          value={formik.values?.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {formik.touched?.password && formik.errors?.password && (
          <FormHelperText id="password-error-text">{formik.errors?.password}</FormHelperText>
        )}

        <ActionsContainer>
          <LoadingAction
            disabled={!formValid}
            loading={loggingIn}
            onClick={handleLogin}
            color="primary"
            icon={""}
          >
            Login
          </LoadingAction>
        </ActionsContainer>
      </StyledForm>
    </Root>
  );
};

export default Login;
