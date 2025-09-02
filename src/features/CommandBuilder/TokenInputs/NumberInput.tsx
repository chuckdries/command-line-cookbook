import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { NumberField } from "../../../components/DesignSystem/NumberField";
import { setTokenValue } from "../commandBuilderSlice";

export function NumberInput({
  name,
}: {
  name: string;
}) {
  const { value } = useAppSelector(
    (state) => state.commandBuilder.tokenValues[name] ?? {},
  );
  const dispatch = useAppDispatch();
  return (
    <NumberField
      name={name}
      value={value as number}
      variant="themed"
      onChange={(value) => dispatch(setTokenValue({ name, value }))}
    />
  );
}
