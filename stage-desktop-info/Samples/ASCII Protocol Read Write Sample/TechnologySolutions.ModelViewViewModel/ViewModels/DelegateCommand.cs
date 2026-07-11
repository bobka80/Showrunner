//-----------------------------------------------------------------------
// <copyright file="DelegateCommand.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Implements <see cref="ICommand"/> using deleates to perform the command and determine whether it can execute
    /// </summary>
    public class DelegateCommand
        : INamedCommand, INotifyPropertyChanged
    {
        /// <summary>
        /// Backing field for name
        /// </summary>
        private string name;

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
        /// Raised when the value of a property changes
        /// </summary>
        public event PropertyChangedEventHandler PropertyChanged;

        /// <summary>
        /// Gets or sets the name of the command
        /// </summary>
        public string Name 
        {
            get                
            {
                return this.name;
            }

            set
            {
                if (this.name != value)
                {
                    this.name = value;
                    this.OnPropertyChanged("Name");
                }
            }
        }

        /// <summary>
        /// Utility method to be used for the CanExecute delegate when the command can always be executed
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        /// <returns>True as the command using this delegate can always execute</returns>
        public static bool CanExecuteAlways(object parameter)
        {
            return true;
        }

        /// <summary>
        /// Utility method to be used for the CanExecute delegate when the command can never be executed
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        /// <returns>False as the command using this delegate can never execute</returns>
        public static bool CanExecuteNever(object parameter)
        {
            return false;
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

        /// <summary>
        /// Raises the PropertyChanged event
        /// </summary>
        /// <param name="propertyName">The name of the property of which the value changed</param>
        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChangedEventHandler handler;

            handler = this.PropertyChanged;
            if (handler != null)
            {
                handler(this, new PropertyChangedEventArgs(propertyName));
            }
        }
    }
}
