import { TextField } from "../../../components/DesignSystem/TextField";
import { TokenDefUrl } from "../commandBuilderTypes";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { setTokenValue } from "../commandBuilderSlice";

interface UrlInputProps {
  name: string;
  item: TokenDefUrl;
}

export function UrlInput({ name }: UrlInputProps) {
  const { value, error } = useAppSelector(
    (state) => state.commandBuilder.tokenValues[name] ?? {}
  );
  const dispatch = useAppDispatch();

  return (
    <>
      <TextField
        errorMessage={error}
        className="flex-1"
        type="url"
        name={name}
        value={value as string}
        variant="themed"
        onChange={(value) => dispatch(setTokenValue({ name, value }))}
      />
    </>
  );
}
