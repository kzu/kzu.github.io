---
title: "How to migrate CallContext to .NETStandard and .NETCore"
description: "If you need to flow data out of band like CallContext did in .NET, here's how in the new world."
tags: [code]
---

Short answer: you don't use CallContext since it's not available to either .NETStandard libraries or .NETCore apps ;-).

Long answer: after landing at [the same question](http://stackoverflow.com/questions/42242222/net-core-equivalent-of-callcontext-logicalget-setdata) 
on StackOverflow, learning about the only [potential answer](http://stackoverflow.com/questions/31707362/how-do-the-semantics-of-asynclocal-differ-from-the-logical-call-context), 
it's pretty straight-forward actually.

Just create the following static class mimicking the CallContext API:

```csharp
    public static class CallContext
    {
        static ConcurrentDictionary<string, object> state = new ConcurrentDictionary<string, object>();

        public static void SetData<T>(string name, T data)
        {
            ((AsyncLocal<T>)state.GetOrAdd(name, _ => new AsyncLocal<T>()))
                .Value = data;
        }

        public static T GetData<T>(string name)
        {
            object data;
            if (state.TryGetValue(name, out data))
                return ((AsyncLocal<T>)data).Value;

            return default(T);
        }

        public static object GetData(string name) => GetData<object>(name);
    }
```

Then just make sure it behaves as you expect, by spinning a bunch of tasks, mixed in with good old 
Threads just for the sake of it, and see the test pass:

```csharp
        [Fact]
        public void WhenFlowingData_ThenCanUseContext()
        {
            var d1 = new object();
            var t1 = default(object);
            var t10 = default(object);
            var t11 = default(object);
            var t12 = default(object);
            var t13 = default(object);
            var d2 = new object();
            var t2 = default(object);
            var t20 = default(object);
            var t21 = default(object);
            var t22 = default(object);
            var t23 = default(object);

            Task.WaitAll(
                Task.Run(() =>
                {
                    CallContext.SetData("d1", d1);
                    new Thread(() => t10 = CallContext.GetData("d1")).Start();
                    Task.WaitAll(
                        Task.Run(() => t1 = CallContext.GetData("d1"))
                            .ContinueWith(t => Task.Run(() => t11 = CallContext.GetData<object>("d1"))),
                        Task.Run(() => t12 = CallContext.GetData("d1")),
                        Task.Run(() => t13 = CallContext.GetData("d1"))
                    );
                }),
                Task.Run(() =>
                {
                    CallContext.SetData("d2", d2);
                    new Thread(() => t20 = CallContext.GetData("d2")).Start();
                    Task.WaitAll(
                        Task.Run(() => t2 = CallContext.GetData<object>("d2"))
                            .ContinueWith(t => Task.Run(() => t21 = CallContext.GetData<object>("d2"))),
                        Task.Run(() => t22 = CallContext.GetData("d2")),
                        Task.Run(() => t23 = CallContext.GetData("d2"))
                    );
                })
            );

            Assert.Same(d1, t1);
            Assert.Same(d1, t10);
            Assert.Same(d1, t11);
            Assert.Same(d1, t12);
            Assert.Same(d1, t13);

            Assert.Same(d2, t2);
            Assert.Same(d2, t20);
            Assert.Same(d2, t21);
            Assert.Same(d2, t22);
            Assert.Same(d2, t23);

            Assert.Null(CallContext.GetData<object>("d1"));
            Assert.Null(CallContext.GetData("d2"));
        }
```

Now add a bunch of parameter validation, type compatibility checks before casting 
the `AsyncLocal<T>`, etc. But the gist of it is that it just works.
