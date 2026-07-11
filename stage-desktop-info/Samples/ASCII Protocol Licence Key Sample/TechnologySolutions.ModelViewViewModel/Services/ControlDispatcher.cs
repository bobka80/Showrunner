//-----------------------------------------------------------------------
// <copyright file="ControlDispatcher.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Services
{
    using System;
    using System.Windows.Forms;

    /// <summary>
    /// Implements <see cref="IDispatcher"/> for Windows Forms
    /// </summary>
    public class ControlDispatcher
        : IDispatcher 
    {
        /// <summary>
        /// Initializes a new instance of the ControlDispatcher class
        /// </summary>
        /// <remarks>
        /// Either this constuctor must be called from the UI thread or Control needs to
        /// be assigned to a Control that has been created on the UI thread.
        /// </remarks>
        public ControlDispatcher()
        {
            this.Control = new Control();
        }

        /// <summary>
        /// Gets or sets a control created on the user interface thread to use
        /// to determine whether an action requires invoking
        /// </summary>
        public Control Control { get; set; }

        /// <summary>
        /// Execute action on the user interface thread. Invoke to the thread if required
        /// </summary>
        /// <param name="action">The action to perform on the user interface thread</param>
        public void InvokeIfRequired(Action action)
        {
            Control control;

            control = this.Control;

            if ((control != null) && control.InvokeRequired)
            {
                control.Invoke(action, new object[] { });
            }
            else if (control == null)
            {
                action();
            }
            else
            {
                action();
            }            
        }
    }
}
