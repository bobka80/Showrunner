
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;
    using System.Threading;

    /// <summary>
    /// Provides a methods to queue an action to be performed on the UI thread
    /// </summary>
    public interface IDispatcher
    {
        /// <summary>
        /// Queues the delegate to be performed on the UI thread
        /// </summary>
        /// <param name="uiAction">The action to perform</param>
        void Dispatch(Action uiAction);
    }

    public class Dispatcher
        : IDispatcher, IDisposable
    {
        /// <summary>
        /// True once an instance of the class is disposed
        /// </summary>
        private bool disposed;

        /// <summary>
        /// Signalled when there are actions to perform on the UI thread
        /// </summary>
        private AutoResetEvent waitAction;

        /// <summary>
        /// Thread that invokes actions on the UI thread
        /// </summary>
        private Thread dispatchThread;

        /// <summary>
        /// Queue of actions to perform on the UI thread
        /// </summary>
        private Queue<Action> queue;

        /// <summary>
        /// Used to invoke actions on the UI thread
        /// </summary>
        private Func<ISynchronizeInvoke> synchronizeInvoke;

        /// <summary>
        /// Initializes a new instance of the Dispatcher class
        /// </summary>
        /// <param name="synchronizeInvoke">An instnace to use to Invoke to the UI thread</param>
        public Dispatcher(Func<ISynchronizeInvoke> synchronizeInvoke)
        {
            if (synchronizeInvoke == null)
            {
                throw new ArgumentNullException("synchronizeInvoke");
            }

            this.dispatchThread = new Thread(this.RunLoop);
            this.dispatchThread.Name = "Dispatch Thread";
            this.dispatchThread.Start();
            this.queue = new Queue<Action>();
            this.synchronizeInvoke = synchronizeInvoke;
            this.waitAction = new AutoResetEvent(false);            
        }

        /// <summary>
        /// Gets or sets the current Dispatcher instance
        /// </summary>
        public static IDispatcher Current { get; set; }

        /// <summary>
        /// Dispatches an item to execute on the UI thread
        /// </summary>
        /// <param name="uiAction"></param>
        public void Dispatch(Action uiAction)
        {
            if (uiAction == null)
            {
                throw new ArgumentNullException("uiAction");
            }

            this.queue.Enqueue(uiAction);
            System.Diagnostics.Debug.WriteLine("Dispactch count =  " + this.queue.Count);
            this.waitAction.Set();
        }

        /// <summary>
        /// Disposesa an instance of the Dispatcher class
        /// </summary>
        public void Dispose()
        {
            this.Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Disposes an instance of the Dispatcher class
        /// </summary>
        /// <param name="disposing">True to dispose managed as well as native resources</param>
        protected virtual void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                this.disposed = true;

                if (disposing)
                {
                    this.waitAction.Set();
                }                
            }
        }

        /// <summary>
        /// Dequeues items from the queue invoking the actions to the UI thread until disposed
        /// </summary>
        private void RunLoop()
        {
            while (!this.disposed)
            {
                this.waitAction.WaitOne(1000);
                while (this.queue.Count > 0 && !this.disposed)
                {
                    Action action;
                    ISynchronizeInvoke synchronizeInvoke;

                    action = this.queue.Dequeue();
                    synchronizeInvoke = this.synchronizeInvoke();

                    if ((synchronizeInvoke == null) || (!synchronizeInvoke.InvokeRequired))
                    {
                        action();
                    }
                    else
                    {
                        synchronizeInvoke.Invoke(action, null);
                    }

                    //this.synchronizeInvoke().Invoke(action, null);
                }
            }
        }
    }
}
