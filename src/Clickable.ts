import {  PickingInfo, PointerEventTypes } from 'babylonjs';

export default interface Clickable {
  onClick(event: PointerEvent, info: PickingInfo, types: PointerEventTypes ): void;
}