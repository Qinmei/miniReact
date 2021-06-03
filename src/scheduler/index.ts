let taskIdCounter = 1;
let taskQueue: any[] = [];
const getCurrentTime = () => performance.now();

// 一次性全都执行完毕，实际上react内部是根据过期时间来区分的，一旦没有同步任务了，就会调用下次的调度器，现在暂时先一次性全搞定吧
const workLoop = () => {
  let currentTask = taskQueue[0];

  while (currentTask) {
    const callback = currentTask.callback;
    const continuationCallback = callback();
    if (continuationCallback) {
      currentTask.callback = continuationCallback;
    } else {
      taskQueue.shift();
    }
    currentTask = taskQueue[0];
  }

  return false;
};

const flushWork = () => {
  return workLoop();
};

const performWorkUntilDeadline = () => {
  let hasMoreWork: any = flushWork();

  if (hasMoreWork) {
    schedulePerformWorkUntilDeadline();
  }
};

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

const schedulePerformWorkUntilDeadline = () => {
  port.postMessage(null);
};

const requestHostCallback = () => {
  schedulePerformWorkUntilDeadline();
};

export function scheduleCallback(callback: any) {
  const currentTime = getCurrentTime();

  const newTask = {
    id: taskIdCounter++,
    callback,
    startTime: currentTime,
  };
  taskQueue.push(newTask);
  requestHostCallback();
}
