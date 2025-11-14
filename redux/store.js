import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";

import pageReducer from "./reducer/reducerPage";
import outboundReducer from "./reducer/reducerOutbound";
import inboundReducer from "./reducer/reducerInbound";

const pagePersistConfig = {
  key: "page",
  storage,
};

const outboundPersistConfig = {
  key: "outbound",
  storage,
};

const inboundPersistConfig = {
  key: "inbound",
  storage,
};

const rootReducer = combineReducers({
  page: persistReducer(pagePersistConfig, pageReducer),
  outbound: persistReducer(outboundPersistConfig, outboundReducer),
  inbound: persistReducer(inboundPersistConfig, inboundReducer),
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
