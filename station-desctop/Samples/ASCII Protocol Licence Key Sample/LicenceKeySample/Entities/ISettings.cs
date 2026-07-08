//-----------------------------------------------------------------------
// <copyright file="ISettings.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;

    /// <summary>
    /// Holds settings for the application
    /// </summary>
    public interface ISettings
        : System.ComponentModel.INotifyPropertyChanged
    {
        /// <summary>
        /// Gets or sets the company name to use when calculating a licence key
        /// </summary>
        string CompanyName { get; set; }

        /// <summary>
        /// Gets or sets the secret to use when calculating a licence key
        /// </summary>
        string Secret { get; set; }
    }
}
