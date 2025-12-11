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
import outboundExternalReducer from "./reducer/reducerOutboundExternal";
import inboundReducer from "./reducer/reducerInbound";
import userReducer from "./reducer/reducerUser";
import workStationsReducer from "@/redux/reducer/reducerWorkStations";
import transferReducer from "./reducer/reducerTransfer";
import inventoryReducer from "./reducer/reducerInventory";

const pagePersistConfig = {
  key: "page",
  storage,
};

const outboundExternalPersistConfig = {
  key: "outboundExternal",
  storage,
};

const inboundPersistConfig = {
  key: "inbound",
  storage,
};

const transferPersistConfig = {
  key: "transfer",
  storage,
};

const inventoryPersistConfig = {
  key: "inventory",
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
  outboundExternal: persistReducer(
    outboundExternalPersistConfig,
    outboundExternalReducer
  ),
  inbound: persistReducer(inboundPersistConfig, inboundReducer),
  transfer: persistReducer(transferPersistConfig, transferReducer),
  user: persistReducer(userPersistConfig, userReducer),
  workstation: persistReducer(workStationsPersistConfig, workStationsReducer),
  inventory: persistReducer(inventoryPersistConfig, inventoryReducer),
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
