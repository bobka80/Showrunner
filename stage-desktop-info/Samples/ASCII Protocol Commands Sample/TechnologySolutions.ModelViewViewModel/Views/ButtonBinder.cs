//-----------------------------------------------------------------------
// <copyright file="ButtonBinder.cs" company="Technology Solutions UK Ltd"> 
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
    /// Binds a <see cref="Button"/> control to a <see cref="ICommand"/>
    /// </summary>
    public class ButtonBinder
        : CommandBinder
    {
        /// <summary>
        /// Initializes a new instance of the ButtonBinder class
        /// </summary>
        /// <param name="control">The button to bind to</param>
        /// <param name="command">The command to bind to</param>
        public ButtonBinder(Control control, ICommand command)
            : base(command)
        {
            INamedCommand namedCommand;

            if (control == null)
            {
                throw new ArgumentNullException("control");
            }

            this.Control = control;
            this.Control.Click += this.Control_Click;
            this.Control.Disposed += this.Control_Disposed;
            this.Command.CanExecuteChanged += this.Command_CanExecuteChanged;            
            this.Control.Enabled = this.Command.CanExecute(this.GetParameter());

            if (((namedCommand = command as INamedCommand) != null) && (namedCommand.Name != null))
            {
                this.Control.Text = namedCommand.Name;
                namedCommand.PropertyChanged += delegate(object sender, System.ComponentModel.PropertyChangedEventArgs e)
                {
                    if (!this.Control.IsDisposed && e.PropertyName.Equals("Name", StringComparison.OrdinalIgnoreCase))
                    {
                        this.Control.Text = namedCommand.Name;
                    }
                };
            }
        }

        /// <summary>
        /// Gets or sets the button that is bound to the command
        /// </summary>
        private Control Control { get; set; }

        /// <summary>
        /// Gets the parameter for CanExecute or Execute. If Parameter is null returns <see cref="Control"/>.Tag
        /// </summary>
        /// <returns>The Parameter</returns>
        protected override object GetParameter()
        {
            return base.GetParameter() ?? this.Control.Tag;
        }

        /// <summary>
        /// Handles the button being cliked by executing the Command
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Control_Click(object sender, EventArgs e)
        {
            this.Command.Execute(this.GetParameter());
        }

        /// <summary>
        /// Updates the button to reflect whether the command is permitted to execute
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Command_CanExecuteChanged(object sender, EventArgs e)
        {
            bool canExecute;

            canExecute = this.Command.CanExecute(this.GetParameter());
            if (!this.Control.IsDisposed)
            {
                if (this.Control.InvokeRequired)
                {
                    this.Control.Invoke(new EventHandler(this.Command_CanExecuteChanged), new object[] { sender, e });
                }
                else
                {
                    this.Control.Enabled = canExecute;
                }
            }
        }

        /// <summary>
        /// Disconnect the Enabled update when the control is disposed
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Control_Disposed(object sender, EventArgs e)
        {
            this.Command.CanExecuteChanged -= this.Command_CanExecuteChanged;
        }
    }
}
