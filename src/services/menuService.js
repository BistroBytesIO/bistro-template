import api from "./api";

export const getMenuItems = async (params = {}) => {
  const response = await api.get("/menu", { params });
  return response.data;
};
export const createMenuItem = async (menuItem) => {
  const response = await api.post("/menu", menuItem);
  return response.data;
};

export const getMenuItemCustomizations = async (menuItemId) => {
  const response = await api.get(`/menu/${menuItemId}/customizations`);
  return response.data;
};

export const getFeaturedItems = async () => {
  const response = await api.get("/menu/featured");
  return response.data;
};
