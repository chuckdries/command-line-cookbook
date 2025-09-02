import { TokenDef } from "../commandBuilderTypes";
import { OpenInput } from "./OpenInput";
import { SaveInput } from "./SaveInput";
import { TextInput } from "./TextInput";
import { UrlInput } from "./UrlInput";
import { NumberInput } from "./NumberInput";

export function TokenInputSwitch({
  item,
  name,
}: {
  item: TokenDef;
  name: string;
}) {
  switch (item.type) {
    case "text":
      return <TextInput name={name} item={item} />;
    case "open":
      return <OpenInput name={name} item={item} />;
    case "save":
      return <SaveInput name={name} item={item} />;
    case "url":
      return <UrlInput name={name} item={item} />;
    case "number":
      return <NumberInput name={name} />;
    default:
      return null;
  }
}
