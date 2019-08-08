import test from "ava";

import { Scheduler, Task } from "./scheduler";

test(t => {
  const s = new Scheduler();

  t.deepEqual(s.length, 0);

  const newTask = new Task("request", "GET", "https://example.com");

  s.push(newTask);

  t.deepEqual(s.length, 1);
});
