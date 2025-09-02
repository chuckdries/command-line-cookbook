import { Button } from "react-aria-components";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { TokenInputSwitch } from "./TokenInputSwitch";
import { X } from "lucide-react";
import { setTokenValue } from "../commandBuilderSlice";
import { TokenDef } from "../commandBuilderTypes";
import { TextField } from "../../../components/DesignSystem/TextField";
import { NumberField } from "../../../components/DesignSystem/NumberField";
import { useState } from "react";

interface MultiValueInputSwitchProps {
  value: string | number;
  onChange: (value: string | number) => void;
  onAdd: (value: string | number) => void;
  type: TokenDef['type'];
}

function MultiValueInputSwitch({ type, value, ...props }: MultiValueInputSwitchProps) {
  switch (type) {
    case "text":
      return <TextField variant="themed" value={value as string} {...props} onKeyUp={(e) => {
        if (e.key === "Enter") {
          props.onAdd(value);
        }
      }} />;
    case "number":
      return <NumberField className="w-20" variant="themed" value={value as number} {...props} onKeyUp={(e) => {
        if (e.key === "Enter") {
          props.onAdd(value);
        }
      }} />;
    default:
      return null;
  }
}

export function MultiValueInput({
  item,
  name,
}: React.ComponentProps<typeof TokenInputSwitch>) {
  const dispatch = useAppDispatch();
  const rawValue = useAppSelector(
    (state) => state.commandBuilder.tokenValues[name].value,
  ) as string;
  const value = rawValue.split(item.delimiter!).map((v) => v.trim());
  const [inputValue, setInputValue] = useState<string | number>("");

  const handleRemoveValue = (index: number) => {
    const newValue = value.filter((_, i) => i !== index).join(item.delimiter!);
    dispatch(setTokenValue({ name, value: newValue }));
  };

  const handleAddValue = (_value: string | number) => {
    const newValue = [...value, _value].join(item.delimiter!)
    setInputValue("");;
    dispatch(setTokenValue({ name, value: newValue }));
  };

  return (
    <div className="flex gap-2 items-center">
      {value.map((v, i) => (
        <Button
          className="border border-hue rounded-lg pl-2 pr-1 flex items-center gap-1"
          key={i}
          type="button"
          onPress={() => handleRemoveValue(i)}
        >
          {v} <X className="text-hue" size={16} />
        </Button>
      ))}
      <MultiValueInputSwitch type={item.type} value={inputValue} onChange={setInputValue} onAdd={handleAddValue} />
    </div>
  );
}
