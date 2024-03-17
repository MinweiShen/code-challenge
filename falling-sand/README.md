Some thinking:

1. Use a SafeBox class to guard all boundary cases
2. Avoid creating too many objects. Better to update state instead of creating new `{hue, v, t}` objects
3. Use a wipGrid to preserve state and alternate between wipGrid / grid. This avoids creating too many grids. I think the idea is very like the WipRoot in React.
