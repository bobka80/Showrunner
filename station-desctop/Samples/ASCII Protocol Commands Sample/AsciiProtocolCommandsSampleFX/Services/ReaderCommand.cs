//-----------------------------------------------------------------------
// <copyright file="ReaderCommand.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.ModelViewViewModel.ViewModels;

    /// <summary>
    /// Dictates the reader states in which a command can execute
    /// </summary>
    public enum ReaderCommandCanExecute
    {
        /// <summary>
        /// The command can never be performed
        /// </summary>
        Never,

        /// <summary>
        /// The command can execute when disconnected
        /// </summary>
        WhenDisconnected,

        /// <summary>
        /// The command can execute when connected
        /// </summary>
        WhenConnected,

        /// <summary>
        /// The command can execute when connected and not performing another command
        /// </summary>
        WhenConnectedAndIdle,

        /// <summary>
        /// The command can always execute
        /// </summary>
        Always
    }

    /// <summary>
    /// Implements <see cref="ICommand"/> for commands that are executed on the reader.
    /// The command can only execute when the reader is in a particular state. The command monitors the reader for changes in state.
    /// The command is executed on a separate thread to prevent blocking the user interface when executing synchronous commands (which block on the caller until complete)
    /// </summary>
    public class ReaderCommand
        : ICommand
    {
        /// <summary>
        /// Cache of the last evaluation of can execute
        /// </summary>
        private bool canExecuteValue;

        /// <summary>
        /// The delegate that executes the command
        /// </summary>
        private Action<object> execute;

        /// <summary>
        /// The state for which the command is permitted to execute
        /// </summary>
        private ReaderCommandCanExecute state;

        /// <summary>
        /// Cache of the command service;
        /// </summary>
        private ICommandService commandService;

        /// <summary>
        /// Initializes a new instance of the ReaderCommand class
        /// </summary>
        /// <param name="executeAction">The action to perform to execute the command</param>
        /// <param name="state">The state the reader</param>
        public ReaderCommand(Action<object> executeAction, ReaderCommandCanExecute state)
        {
            if (executeAction == null)
            {
                throw new ArgumentNullException("executeAction");
            }

            // when used from the designer services are not initializsed use a mock
            // when run in the application use the real service
            this.commandService = ServiceProvider.Current != null ? ServiceProvider.Current.Get<ICommandService>() : new DesignerCommandService();

            this.execute = executeAction;
            this.state = state;
            this.canExecuteValue = this.CanExecute(null);

            this.commandService.StateChanged += this.Reader_StateChanged;
        }

        /// <summary>
        /// Raised when the CanExecute evaluation changes state
        /// </summary>
        public event EventHandler CanExecuteChanged;

        /// <summary>
        /// Refresh the evaluation of <see cref="CanExecute"/> and raise <see cref="CanExecuteChanged"/> if required
        /// </summary>
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
        /// Perform the command. Performs the command on a thread pool thread so as not to block the caller for synchronised comamnds
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        public void Execute(object parameter)
        {
            System.Threading.ThreadPool.QueueUserWorkItem(
                delegate(object state) { this.execute(state); },
                parameter);
        }

        /// <summary>
        /// Evaluates whether the command can currently be executed
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        /// <returns>True if the command can execute, false otherwise</returns>
        public bool CanExecute(object parameter)
        {
            switch (this.state)
            {
                case ReaderCommandCanExecute.Always:
                    return true;

                case ReaderCommandCanExecute.Never:
                    return false;

                case ReaderCommandCanExecute.WhenConnected:
                    return this.commandService.IsConnected;

                case ReaderCommandCanExecute.WhenConnectedAndIdle:
                    // note the first only returns true if Service.Reader is not null
                    return this.commandService.IsConnected && !this.commandService.IsInCommand;

                case ReaderCommandCanExecute.WhenDisconnected:
                    return !this.commandService.IsConnected;

                default:
                    return false;
            }
        }

        /// <summary>
        /// Raises the <see cref="CanExecuteChanged"/> event
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
        /// When the state of the reader changes re-evauluate whether the command <see cref="CanExecute"/>
        /// </summary>
        /// <param name="sender">The source of the event</param>
        /// <param name="e">Data provided for the event</param>
        private void Reader_StateChanged(object sender, EventArgs e)
        {
            this.Refresh();
        }
    }
}
