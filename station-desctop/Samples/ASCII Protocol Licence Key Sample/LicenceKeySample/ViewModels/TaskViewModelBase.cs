//-----------------------------------------------------------------------
// <copyright file="TaskViewModelBase.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;    
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.ModelViewViewModel.ViewModels;

    /// <summary>
    /// Base view model to provide a task execute 
    /// </summary>
    public abstract class TaskViewModelBase
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for IsBusy
        /// </summary>
        private bool isBusy;

        /// <summary>
        /// Backing field for ErrorMessage
        /// </summary>
        private string errorMessage;

        /// <summary>
        /// Gets or sets a value indicating whether a task is currently being performed
        /// </summary>
        public bool IsBusy
        {
            get
            {
                return this.isBusy;
            }

            protected set
            {
                this.SetProperty(ref this.isBusy, value, "IsBusy");
            }
        }

        /// <summary>
        /// Gets or sets an error message that indicates why a task failed
        /// </summary>
        public string ErrorMessage
        {
            get
            {
                return this.errorMessage;
            }

            protected set
            {
                this.SetProperty(ref this.errorMessage, value, "ErrorMessage");
            }
        }

        /// <summary>
        /// Performs a task
        /// </summary>
        /// <param name="canExecute">True if the task should be executed</param>
        /// <param name="task">The task to execute</param>
        /// <remarks>
        /// Performs task. 
        /// Sets and clears the <see cref="IsBusy"/> flag at the start and end of the task respectively
        /// Sets ErrorMessage with the message of any exception thrown during the task
        /// </remarks>
        /// <exception cref="InvalidOperationException">If another task is already being performed</exception>
        protected void PerformTask(bool canExecute, Action task)
        {
            if (!canExecute)
            {
                return;
            }

            if (this.IsBusy)
            {
                throw new InvalidOperationException("already busy with task");
            }
            
            try
            {
                this.IsBusy = true;
                task();
            }
            catch (Exception ex)
            {
                this.ErrorMessage = ex.Message;
            }
            finally
            {
                this.IsBusy = false;
            }
        }
    }
}
