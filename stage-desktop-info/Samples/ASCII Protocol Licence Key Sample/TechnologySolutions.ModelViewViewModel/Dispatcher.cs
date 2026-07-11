//-----------------------------------------------------------------------
// <copyright file="Dispatcher.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel
{
    using System;    
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Services;

    /// <summary>
    /// Provides a global mechanism to update of the user interface
    /// </summary>
    public static class Dispatcher
    {
        /// <summary>
        /// Synchronizes access to the Current property
        /// </summary>
        private static object sync = new object();

        /// <summary>
        /// Backing field for Current
        /// </summary>
        private static IDispatcher current;

        /// <summary>
        /// Gets or sets the current <see cref="IDispatcher"/> instance
        /// </summary>
        public static IDispatcher Current
        {
            get
            {
                lock (sync)
                {
                    if (current == null)
                    {
                        current = ServiceProvider.Current.Get<IDispatcher>();
                    }
                }

                return current;
            }

            set
            {
                lock (sync)
                {
                    current = value;
                }
            }
        }

        /// <summary>
        /// Execute action on the user interface thread. Invoke to the thread if required
        /// </summary>
        /// <param name="action">The action to perform on the user interface thread</param>
        public static void InvokeIfRequired(Action action)
        {
            Current.InvokeIfRequired(action);
        }
    }
}
