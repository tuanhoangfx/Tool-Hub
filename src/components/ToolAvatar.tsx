import { MaterialIcon } from "./MaterialIcon";
import { HubToolAvatar, type HubToolAvatarProps } from "@tool-workspace/hub-ui";

type ToolAvatarProps = Omit<HubToolAvatarProps, "glyph" | "icon"> & {
  iconName: string;
};

export function ToolAvatar({ iconName, scaled = true, ...props }: ToolAvatarProps) {
  const iconPx = props.size === "lg" ? 22 : props.size === "sm" ? 16 : 18;
  return (
    <HubToolAvatar
      {...props}
      scaled={scaled}
      glyph={<MaterialIcon name={iconName} size={iconPx} />}
    />
  );
}
