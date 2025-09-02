import { open } from "@tauri-apps/plugin-dialog";
import { TokenDefOpen } from "../commandBuilderTypes";
import { Button } from "../../../components/DesignSystem/Button";
import { TextField } from "../../../components/DesignSystem/TextField";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { setTokenValue } from "../commandBuilderSlice";
import { useDisplayPath } from "../../Terminal/useDisplayPath";

interface OpenInputProps {
  name: string;
  item: TokenDefOpen;
}

export function OpenInput({ name, item }: OpenInputProps) {
  const { value, error } = useAppSelector(
    (state) => state.commandBuilder.tokenValues[name] ?? {},
  );
  const dispatch = useAppDispatch();
  const { path, onChange } = useDisplayPath(value as string, (value) =>
    dispatch(setTokenValue({ name, value })),
  );

  const handleOpen = async () => {
    const path = await open({
      multiple: false,
      filters: item.filters,
    });
    if (path) {
      dispatch(setTokenValue({ name, value: path }));
    }
  };

  return (
    <>
      <Button type="button" variant="themed" onClick={handleOpen}>
        Select a file
      </Button>
      <TextField
        validationBehavior="aria"
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
