import { TokenDefText } from "../commandBuilderTypes";
import { TextField } from "../../../components/DesignSystem/TextField";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { setTokenValue } from "../commandBuilderSlice";

interface TextInputProps {
  name: string;
  item: TokenDefText;
}

export function TextInput({ name }: TextInputProps) {
  const dispatch = useAppDispatch();
  const { value, error } = useAppSelector(
    (state) => state.commandBuilder.tokenValues[name] ?? {}
  );

  return (
    <>
      <TextField
        errorMessage={error}
        className="flex-1"
        type="text"
        name={name}
        value={value as string}
        variant="themed"
        onChange={(value) => dispatch(setTokenValue({ name, value }))}
      />
    </>
  );
}
