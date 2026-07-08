//-----------------------------------------------------------------------
// <copyright file="ButtonBinder.cs" company="Technology Solutions UK Ltd"> 
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
    using System.Windows.Forms;

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
            if (control == null)
            {
                throw new ArgumentNullException("control");
            }

            this.Control = control;
            this.Control.Click += this.Control_Click;
            this.Command.CanExecuteChanged += this.Command_CanExecuteChanged;
            this.Control.Enabled = this.Command.CanExecute(null);
        }

        /// <summary>
        /// Gets or sets the button that is bound to the command
        /// </summary>
        private Control Control { get; set; }

        /// <summary>
        /// Handles the button being cliked by executing the <see cref="Command"/>
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Control_Click(object sender, EventArgs e)
        {
            this.Command.Execute(null);
        }

        /// <summary>
        /// Updates the button to reflect whether the command is permitted to execute
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Command_CanExecuteChanged(object sender, EventArgs e)
        {
            if (this.Control.InvokeRequired)
            {
                this.Control.Invoke(new EventHandler(this.Command_CanExecuteChanged), new object[] { sender, e });
            }
            else
            {
                this.Control.Enabled = this.Command.CanExecute(null);
            }
        }
    }
}
