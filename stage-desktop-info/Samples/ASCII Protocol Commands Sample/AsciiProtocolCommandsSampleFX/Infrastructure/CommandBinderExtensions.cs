//-----------------------------------------------------------------------
// <copyright file="CommandBinderExtensions.cs" company="Technology Solutions UK Ltd"> 
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
    /// Provides extensions for command binding
    /// </summary>
    public static class CommandBinderExtensions
    {
        /// <summary>
        /// Binds a Button to an ICommand
        /// </summary>
        /// <param name="bindings">Container for bindings</param>
        /// <param name="button">The button to trigger the command</param>
        /// <param name="command">The command to execute on button press</param>
        public static void Bind(this IList<CommandBinder> bindings, Button button, ICommand command)
        {
            bindings.Add(new ButtonBinder(button, command));
        }

        /// <summary>
        /// Binds a ToolStripMenuItem to an ICommand
        /// </summary>
        /// <param name="bindings">Container for bindings</param>
        /// <param name="menuItem">The menu item to trigger the command</param>
        /// <param name="command">The command to execute on press</param>
        public static void Bind(this IList<CommandBinder> bindings, ToolStripMenuItem menuItem, ICommand command)
        {
            bindings.Add(new ToolStripMenuItemBinder(menuItem, command));
        }
    }
}
