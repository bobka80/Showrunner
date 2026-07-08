//-----------------------------------------------------------------------
// <copyright file="ICommand.cs" company="Technology Solutions UK Ltd"> 
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
    /// Defines a command that can be performed with methods and events to detetmine if this is permitted
    /// </summary>
    public interface ICommand
    {
        /// <summary>
        /// Raised when the evaluation of CanExecute would return a different value
        /// </summary>
        event EventHandler CanExecuteChanged;

        /// <summary>
        /// Performs the command
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        void Execute(object parameter);

        /// <summary>
        /// Returns a value indicating whether Execute can currently be called
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        /// <returns>True if Execute can be called, false otherwise</returns>
        bool CanExecute(object parameter);
    }
}
