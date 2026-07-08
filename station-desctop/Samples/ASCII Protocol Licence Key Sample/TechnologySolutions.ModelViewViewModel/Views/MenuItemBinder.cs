//-----------------------------------------------------------------------
// <copyright file="MenuItemBinder.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Views
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    using ViewModels;

    /// <summary>
    /// <see cref="CommandBinder"/> to bind a <see cref="MenuItem"/> to a <see cref="ICommand"/>
    /// </summary>
    public class MenuItemBinder
        : CommandBinder
    {        
        /// <summary>
        /// Initializes a new instance of the MenuItemBinder class
        /// </summary>
        /// <param name="control">The control to bind to</param>
        /// <param name="command">The command to bind to</param>
        public MenuItemBinder(MenuItem control, ICommand command)
            : base(command)
        {
            INamedCommand namedCommand;

            if (control == null)
            {
                throw new ArgumentNullException("control");
            }

            this.Control = control;
            this.Control.Click += this.Control_Click;
            this.Command.CanExecuteChanged += this.Command_CanExecuteChanged;
            this.Control.Enabled = this.Command.CanExecute(this.GetParameter());

            if (((namedCommand = command as INamedCommand) != null) && (namedCommand.Name != null))
            {
                this.Control.Text = namedCommand.Name;
                namedCommand.PropertyChanged += delegate(object sender, System.ComponentModel.PropertyChangedEventArgs e)
                {
                    if (e.PropertyName.Equals("Name", StringComparison.OrdinalIgnoreCase))
                    {
                        this.Control.Text = namedCommand.Name;
                    }
                };
            }
        }

        /// <summary>
        /// Gets the user interface element to bind to
        /// </summary>
        public MenuItem Control { get; private set; }

        /// <summary>
        /// Handles the user interface element being cliked by executing the Command
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Control_Click(object sender, EventArgs e)
        {
            this.Command.Execute(this.GetParameter());
        }

        /// <summary>
        /// Updates the user interface element to reflect whether the command is permitted to execute
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Command_CanExecuteChanged(object sender, EventArgs e)
        {
            bool canExecute;

            canExecute = this.Command.CanExecute(this.GetParameter());

            Dispatcher.InvokeIfRequired(() =>
            {
                this.Control.Enabled = canExecute;
            });
        }
    }
}
