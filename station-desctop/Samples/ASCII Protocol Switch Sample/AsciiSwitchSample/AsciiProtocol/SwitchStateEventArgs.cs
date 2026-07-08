//-----------------------------------------------------------------------
// <copyright file="SwitchStateEventArgs.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.Rfid.AsciiProtocol
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Provides data for an event where the <see cref="SwitchState"/> has changed
    /// </summary>
    public class SwitchStateEventArgs
        : EventArgs
    {
        /// <summary>
        /// Initializes a new instance of the SwitchStateEventArgs class
        /// </summary>
        /// <param name="state">The new state of the switch</param>
        public SwitchStateEventArgs(SwitchState state)
        {
            this.State = state;
        }

        /// <summary>
        /// Gets the state of the switch
        /// </summary>
        public SwitchState State { get; private set; }
    }
}
