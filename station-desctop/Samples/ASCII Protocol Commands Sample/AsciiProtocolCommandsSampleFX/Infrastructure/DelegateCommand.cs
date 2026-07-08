//-----------------------------------------------------------------------
// <copyright file="DelegateCommand.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Implements <see cref="ICommand"/> using deleates to perform the command and determine whether it can execute
    /// </summary>
    public class DelegateCommand
        : ICommand
    {
        /// <summary>
        /// Cache of the result of the last evaluation of <see cref="CanExecute"/>
        /// </summary>
        private bool canExecuteValue;

        /// <summary>
        /// The action to perform to execute the command
        /// </summary>
        private Action<object> execute;

        /// <summary>
        /// The delegate that determines whether the command can execute
        /// </summary>
        private Func<object, bool> canExecute;

        /// <summary>
        /// Initializes a new instance of the DelegateCommand class
        /// </summary>
        /// <param name="executeAction">The action the performs the command</param>
        /// <param name="canExecuteAction">The delegate that returns a value indicating whether the command can be performed</param>
        public DelegateCommand(Action<object> executeAction, Func<object, bool> canExecuteAction)
        {
            if (executeAction == null)
            {
                throw new ArgumentNullException("executeAction");
            }

            if (canExecuteAction == null)
            {
                throw new ArgumentNullException("canExecuteAction");
            }

            this.execute = executeAction;
            this.canExecute = canExecuteAction;
            this.canExecuteValue = this.CanExecute(null);
        }

        /// <summary>
        /// Raised when the <see cref="CanExecute"/> state changes
        /// </summary>
        public event EventHandler CanExecuteChanged;

        /// <summary>
        /// Helper method that can be used for the canExecuteAction delegate where the action can always execute (i.e. returns true)
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        /// <returns>Always returns true</returns>
        public static bool CanExecuteAlways(object parameter)
        {
            return true;
        }

        /// <summary>
        /// Evaluates <see cref="CanExecute"/> and compares to the previous evaluation and raises <see cref="CanExecuteChanged"/> if different
        /// </summary>
        /// TODO: this logic is flawed if we start to make use of parameter
        public void Refresh()
        {
            bool current;

            current = this.CanExecute(null);
            if (this.canExecuteValue != current)
            {
                this.canExecuteValue = current;
                this.OnCanExecuteChanged();
            }
        }

        /// <summary>
        /// Performs the command
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        public void Execute(object parameter)
        {
            this.execute(parameter);
        }

        /// <summary>
        /// Returns a value indicating whether Execute can currently be called
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        /// <returns>True if Execute can be called, false otherwise</returns>
        public bool CanExecute(object parameter)
        {
            return this.canExecute(parameter);
        }

        /// <summary>
        /// Call to raise the <see cref="CanExecuteChanged"/> event
        /// </summary>
        protected virtual void OnCanExecuteChanged()
        {
            EventHandler handler;

            handler = this.CanExecuteChanged;
            if (handler != null)
            {
                handler(this, EventArgs.Empty);
            }
        }
    }
}
