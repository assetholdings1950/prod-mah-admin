import { UserInterface } from "@/interface/user";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface AuthState {
    isAuthenticated: boolean;
    user: UserInterface | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;

}

const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false
}


const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        signin(state, action: PayloadAction<{ user: UserInterface }>) {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.accessToken = null;
            state.refreshToken = action.payload.user.refreshToken

        },
        signout(state) {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false
        },
        updateUserData(state, action: PayloadAction<{ user: UserInterface }>) {
            state.user = action.payload.user;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        }
    }
})

export const { signin, signout, updateUserData, setLoading } = authSlice.actions;

export default authSlice.reducer;