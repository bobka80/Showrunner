//-----------------------------------------------------------------------
// <copyright file="CommandBinder.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocol.Sample
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Base class that binds an <see cref="ICommand" /> to a user interface element
    /// </summary>
    public abstract class CommandBinder
    {        
        /// <summary>
        /// Initializes a new instance of the CommandBinder class
        /// </summary>
        /// <param name="command">The command to associate with the user interface element</param>
        protected CommandBinder(ICommand command)
        {
            if (command == null)
            {
                throw new ArgumentNullException("command");
            }

            this.Command = command;
        }

        /// <summary>
        /// Gets the command associated with the user interface element
        /// </summary>
        public ICommand Command { get; private set; }
    }    
}
