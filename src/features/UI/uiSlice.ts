import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  // When true, the main page title is visible in the page content area
  // so the TopNav should hide its own title. When false, show TopNav title.
  pageTitleInView: boolean;
  // Terminal layout direction and visibility live in UI slice
  panelVisible: boolean;
  layout: 'horizontal' | 'vertical';
}

const initialState: UIState = {
  pageTitleInView: true,
  panelVisible: false,
  layout: 'horizontal',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setPageTitleInView(state, action: PayloadAction<boolean>) {
      state.pageTitleInView = action.payload;
    },
    setPanelVisible(state, action: PayloadAction<boolean>) {
      state.panelVisible = action.payload;
    },
    setLayout(state, action: PayloadAction<'horizontal' | 'vertical'>) {
      state.layout = action.payload;
    },
  },
});

export const { setPageTitleInView, setPanelVisible, setLayout } = uiSlice.actions;
export default uiSlice.reducer;
