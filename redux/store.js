import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import pageReducer from "./reducer/reducerPage";
import userReducer from "./reducer/reducerUser";
import workStationsReducer from "@/redux/reducer/reducerWorkStations";

const pagePersistConfig = {
  key: "page",
  storage,
};

const userPersistConfig = {
  key: "user",
  storage,
};

const workStationsPersistConfig = {
  key: "workstation",
  storage,
};

const rootReducer = combineReducers({
  page: persistReducer(pagePersistConfig, pageReducer),
  user: persistReducer(userPersistConfig, userReducer),
  workstation: persistReducer(workStationsPersistConfig, workStationsReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
