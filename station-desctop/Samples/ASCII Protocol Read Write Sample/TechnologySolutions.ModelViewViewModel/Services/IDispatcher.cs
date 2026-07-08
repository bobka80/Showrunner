//-----------------------------------------------------------------------
// <copyright file="IDispatcher.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Services
{
    using System;
    using System.Collections.Generic;
    using System.Text;

    /// <summary>
    /// Provides a method to perform an action on the user interface thread
    /// </summary>
    public interface IDispatcher
    {
        /// <summary>
        /// Execute action on the user interface thread. Invoke to the thread if required
        /// </summary>
        /// <param name="action">The action to perform on the user interface thread</param>
        void InvokeIfRequired(Action action);
    }
}
