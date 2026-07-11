//-----------------------------------------------------------------------
// <copyright file="IIdentifiedItemEventArgs.cs" company="Technology Solutions UK Ltd"> 
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

    using Entities;

    /// <summary>
    /// Provides data for an <see cref="IIdentifiedItem"/> event
    /// </summary>
    public class IIdentifiedItemEventArgs
        : EventArgs
    {
        /// <summary>
        /// Initializes a new instance of the IIdentifiedItemEventArgs class
        /// </summary>
        /// <param name="value">The item identified</param>
        public IIdentifiedItemEventArgs(IIdentifiedItem value)
        {
            this.Value = value;
        }

        /// <summary>
        /// Gets the identified item for the event
        /// </summary>
        public IIdentifiedItem Value { get; private set; }
    }
}
