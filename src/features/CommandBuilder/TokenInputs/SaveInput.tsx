import { save } from "@tauri-apps/plugin-dialog";
import { TokenDefSave } from "../commandBuilderTypes";
import { Button } from "../../../components/DesignSystem/Button";
import { TextField } from "../../../components/DesignSystem/TextField";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { setTokenValue } from "../commandBuilderSlice";
import { useDisplayPath } from "../../Terminal/useDisplayPath";

interface SaveInputProps {
  name: string;
  item: TokenDefSave;
}

export function SaveInput({ name, item }: SaveInputProps) {
  const dispatch = useAppDispatch();
  const { value, error } = useAppSelector(
    (state) => state.commandBuilder.tokenValues[name] ?? {}
  );

  const { path, onChange } = useDisplayPath(value as string, (value) =>
    dispatch(setTokenValue({ name, value }))
  );

  const handleSave = async () => {
    const path = await save({
      filters: item.filters,
      defaultPath: item.defaultPath,
    });
    if (path) {
      dispatch(setTokenValue({ name, value: path }));
    }
  };

  return (
    <>
      <Button type="button" variant="themed" onClick={handleSave}>
        Select save location
      </Button>
      <TextField
        errorMessage={error}
        className="flex-1"
        type="text"
        name={name}
        value={path}
        variant="themed"
        onChange={onChange}
      />
    </>
  );
}
